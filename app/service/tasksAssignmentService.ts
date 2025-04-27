/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// First, let's create the TaskAssignmentService in a new file
// filepath: c:\Users\DELL\Desktop\tasktrek\app\services\taskAssignmentService.ts


interface TaskResponse {
  data: any;
  success: boolean;
  message: string;
}

export const assignTask = async (taskId: string, userId: string) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/tasks/${taskId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ userId })
    });

    const data: TaskResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to assign task');
    }

    return data.data;
  } catch (error: any) {
    console.error('Error assigning task:', error);
    throw new Error(error.message || 'Failed to assign task');
  }
};

export const unassignTask = async (taskId: string) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/tasks/${taskId}/unassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    const data: TaskResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to unassign task');
    }

    return data.data;
  } catch (error: any) {
    console.error('Error unassigning task:', error);
    throw new Error(error.message || 'Failed to unassign task');
  }
};