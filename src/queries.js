import { HttpError } from 'wasp/server'

export const getTasks = async (args, context) => {
  if (!context.user) { throw new HttpError(401) }

  return await context.entities.Task.findMany({
    where: { userId: context.user.id },
    orderBy: { position: 'asc' }
  });
}
