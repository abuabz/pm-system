"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Paperclip, Calendar } from "lucide-react";
import { format } from "date-fns";
import { TaskDetailsModal } from "./TaskDetailsModal";

const COLUMNS = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
];

export default function KanbanBoard({ projectId, initialTasks }: { projectId: string, initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      apiClient.patch(`/tasks/${id}/status`, { status }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic update
    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex(t => t.id === draggableId);
    if (taskIndex > -1) {
      const updatedTask = { ...newTasks[taskIndex], status: destination.droppableId };
      newTasks.splice(taskIndex, 1);
      
      // Need to find correct insertion index within the overall tasks array based on the destination droppable
      // For simplicity in UI, we just push it to the end of the matching column
      // A full sorting implementation requires a sortOrder field. We rely on refetch for precise order if backend handles it.
      setTasks([...newTasks, updatedTask]);
      
      updateStatusMutation.mutate({ id: draggableId, status: destination.droppableId });
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(t => t.status === status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 h-full items-start">
        {COLUMNS.map(column => (
          <div key={column.id} className="flex flex-col flex-shrink-0 w-80 bg-slate-100 dark:bg-slate-900/50 rounded-xl max-h-full">
            <div className="p-4 font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              {column.title}
              <Badge variant="secondary">{getTasksByStatus(column.id).length}</Badge>
            </div>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-3 flex-1 overflow-y-auto min-h-[150px]"
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`mb-3 last:mb-0 ${snapshot.isDragging ? 'opacity-75' : ''}`}
                          style={{
                            ...provided.draggableProps.style,
                          }}
                        >
                          <Card 
                            className="hover:border-blue-500 transition-colors shadow-sm cursor-grab active:cursor-grabbing"
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="text-[10px] uppercase">{task.priority}</Badge>
                              </div>
                              <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                              
                              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  {task.dueDate && (
                                    <>
                                      <Calendar className="h-3 w-3" />
                                      <span>{format(new Date(task.dueDate), "MMM d")}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1" title="Comments">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{task._count?.comments || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1" title="Attachments">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{task._count?.attachments || 0}</span>
                                  </div>
                                  {task.assignee && (
                                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                                      {task.assignee.firstName[0]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
      <TaskDetailsModal 
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </DragDropContext>
  );
}
