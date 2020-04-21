import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { TodosAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'

const todoAccess = new TodosAccess()

export async function getUserTodos(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken)

  return await todoAccess.getTodosByUserId(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)

  return await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    createdAt: new Date().toISOString()
  })
}

export async function deleteTodo(
  todoId: string,
  jwtToken: string
): Promise<TodoItem> {

  const userId = parseUserId(jwtToken)

  return await todoAccess.deleteTodo(todoId, userId)
}

export async function updateTodo(
  todoId: string,
  updateTodoRequest: UpdateTodoRequest,
  jwtToken: string
): Promise<TodoUpdate> {

  const userId = parseUserId(jwtToken)

  const updatedTodo: unknown = todoAccess.updateTodo(userId, todoId,{
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  })

  return updatedTodo as TodoUpdate
}
