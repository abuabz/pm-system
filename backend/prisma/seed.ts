import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Database with Roles and Permissions...');

  // 1. Create Permissions
  const resources = ['users', 'projects', 'tasks', 'comments', 'reports', 'audit_logs'];
  const actions = ['create', 'read', 'update', 'delete'];

  const createdPermissions = [];

  for (const resource of resources) {
    for (const action of actions) {
      // Audit logs and reports are usually read-only
      if (['audit_logs', 'reports'].includes(resource) && action !== 'read') {
        continue;
      }
      
      const perm = await prisma.permission.upsert({
        where: { action_resource: { action, resource } },
        update: {},
        create: { action, resource, description: `Can ${action} ${resource}` },
      });
      createdPermissions.push(perm);
    }
  }

  // 2. Define Roles and their Permissions mappings
  const rolesWithPerms = [
    {
      name: 'Super Admin',
      description: 'System administrator with all privileges',
      permissions: createdPermissions, // all permissions
    },
    {
      name: 'Admin',
      description: 'Administrator with most privileges but restricted system access',
      permissions: createdPermissions.filter(p => p.resource !== 'audit_logs'),
    },
    {
      name: 'Project Manager',
      description: 'Can manage projects, tasks, and users within projects',
      permissions: createdPermissions.filter(p => 
        ['projects', 'tasks', 'comments', 'reports'].includes(p.resource)
      ),
    },
    {
      name: 'Team Lead',
      description: 'Can read projects and manage tasks',
      permissions: createdPermissions.filter(p => 
        (p.resource === 'projects' && p.action === 'read') ||
        ['tasks', 'comments'].includes(p.resource)
      ),
    },
    {
      name: 'Developer',
      description: 'Standard team member. Can read/update tasks and comment',
      permissions: createdPermissions.filter(p => 
        (p.resource === 'projects' && p.action === 'read') ||
        (p.resource === 'tasks' && ['read', 'update'].includes(p.action)) ||
        ['comments'].includes(p.resource)
      ),
    },
  ];

  // 3. Create Roles and Link Permissions
  for (const roleData of rolesWithPerms) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: { name: roleData.name, description: roleData.description },
    });

    // Clear existing permissions to avoid duplicates if re-running
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Assign mapped permissions
    for (const perm of roleData.permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
