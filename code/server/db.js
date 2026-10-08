import mongoose from 'mongoose'

let memoryServer = null

export async function connectDb() {
  let uri = process.env.MONGODB_URI
  let mode = 'mongodb'

  if (!uri) {
    // No MONGODB_URI: boot a throwaway in-memory MongoDB so the prototype runs anywhere.
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    memoryServer = await MongoMemoryServer.create()
    uri = memoryServer.getUri()
    mode = 'memory'
  }

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'smart_kaksha' })
  return mode
}

export async function disconnectDb() {
  await mongoose.disconnect()
  if (memoryServer) await memoryServer.stop()
}
