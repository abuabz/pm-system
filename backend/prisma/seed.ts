import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Wiping old database data...');
  
  // Wipe everything in correct order to respect foreign keys
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});

  console.log('Seeding Database with Roles and Permissions...');

  // 1. Create Permissions
  const resources = ['users', 'projects', 'tasks', 'comments', 'reports', 'audit_logs'];
  const actions = ['create', 'read', 'update', 'delete'];

  const createdPermissions = [];

  for (const resource of resources) {
    for (const action of actions) {
      if (['audit_logs', 'reports'].includes(resource) && action !== 'read') {
        continue;
      }
      
      const perm = await prisma.permission.create({
        data: { action, resource, description: `Can ${action} ${resource}` },
      });
      createdPermissions.push(perm);
    }
  }

  // 2. Define Roles and their Permissions mappings
  const rolesWithPerms = [
    {
      name: 'Super Admin',
      description: 'System administrator with all privileges',
      permissions: createdPermissions,
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
        ['projects', 'tasks', 'comments', 'reports'].includes(p.resource) ||
        (p.resource === 'users' && p.action === 'read')
      ),
    },
    {
      name: 'Team Lead',
      description: 'Can read projects and manage tasks',
      permissions: createdPermissions.filter(p => 
        (p.resource === 'projects' && p.action === 'read') ||
        ['tasks', 'comments'].includes(p.resource) ||
        (p.resource === 'users' && p.action === 'read')
      ),
    },
    {
      name: 'Developer',
      description: 'Standard team member. Can read/update tasks and comment',
      permissions: createdPermissions.filter(p => 
        (p.resource === 'projects' && p.action === 'read') ||
        (p.resource === 'tasks' && ['read', 'update', 'create'].includes(p.action)) ||
        ['comments'].includes(p.resource) ||
        (p.resource === 'users' && p.action === 'read')
      ),
    },
  ];

  // 3. Create Roles and Link Permissions
  const roleCache: Record<string, any> = {};
  for (const roleData of rolesWithPerms) {
    const role = await prisma.role.create({
      data: { name: roleData.name, description: roleData.description },
    });
    
    roleCache[role.name] = role;

    for (const perm of roleData.permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  console.log('Roles and Permissions seeded!');
  console.log('Generating exactly 5 new mock users...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      passwordHash,
      roleId: roleCache['Super Admin'].id,
      accountStatus: 'ACTIVE'
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'System Admin',
      passwordHash,
      roleId: roleCache['Admin'].id,
      accountStatus: 'ACTIVE'
    }
  });

  const pm = await prisma.user.create({
    data: {
      email: 'pm@example.com',
      name: 'Project Manager',
      passwordHash,
      roleId: roleCache['Project Manager'].id,
      accountStatus: 'ACTIVE'
    }
  });

  const tl = await prisma.user.create({
    data: {
      email: 'tl@example.com',
      name: 'Team Lead',
      passwordHash,
      roleId: roleCache['Team Lead'].id,
      accountStatus: 'ACTIVE'
    }
  });

  const dev = await prisma.user.create({
    data: {
      email: 'dev@example.com',
      name: 'Core Developer',
      passwordHash,
      roleId: roleCache['Developer'].id,
      accountStatus: 'ACTIVE'
    }
  });

  console.log('Users generated successfully!');
  console.log('Generating mock project and tasks...');

  const project = await prisma.project.create({
    data: {
      name: 'Beta Platform Launch',
      description: 'Final preparation and feature rollout for the beta launch.',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      members: {
        create: [
          { userId: admin.id, role: 'MANAGER' },
          { userId: pm.id, role: 'MANAGER' },
          { userId: tl.id, role: 'MEMBER' },
          { userId: dev.id, role: 'MEMBER' }
        ]
      }
    }
  });

  const task1 = await prisma.task.create({
    data: {
      title: 'Finalize Deployment Pipeline',
      description: 'Ensure CI/CD workflows are passing and production ready.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project.id,
      reporterId: pm.id,
      assigneeId: tl.id,
      estimatedHours: 8,
      actualHours: 4
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Fix Authentication Edge Cases',
      description: 'Resolve the outstanding issues with JWT refresh tokens.',
      status: 'TODO',
      priority: 'URGENT',
      projectId: project.id,
      reporterId: tl.id,
      assigneeId: dev.id,
      estimatedHours: 12
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Project Kickoff Meeting',
      description: 'Align the team on deliverables for the upcoming sprint.',
      status: 'DONE',
      priority: 'MEDIUM',
      projectId: project.id,
      reporterId: admin.id,
      assigneeId: pm.id,
      estimatedHours: 2,
      actualHours: 2
    }
  });

  await prisma.comment.create({
    data: {
      content: 'I will start looking into the authentication issues tomorrow morning.',
      taskId: task2.id,
      authorId: dev.id
    }
  });

  await prisma.comment.create({
    data: {
      content: 'Let me know if you need any help with the token rotation logic.',
      taskId: task2.id,
      authorId: tl.id
    }
  });

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
