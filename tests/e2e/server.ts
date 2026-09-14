import { createServer } from 'vite'

export default async function setup() {
  const server = await createServer({ server: { host: '127.0.0.1', port: 5186, strictPort: true } })
  try {
    await server.listen()
  } catch (error) {
    await server.close()
    throw error
  }
  return () => server.close()
}
