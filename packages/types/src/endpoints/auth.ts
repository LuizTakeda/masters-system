import { z } from "zod"

//**************************************************
// GET /auth/me
//**************************************************

export const AuthMeGetResponseSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  username: z.string(),
  email: z.email(),
  roles: z.array(z.string())
})

export type AuthMeGetResponseType = z.infer<typeof AuthMeGetResponseSchema>