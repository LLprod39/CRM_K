const clients = new Set<ReadableStreamDefaultController<Uint8Array>>()
const encoder = new TextEncoder()

export function registerWhatsAppClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  clients.add(controller)
}

export function unregisterWhatsAppClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  clients.delete(controller)
}

export function broadcastWhatsAppUpdate(update: unknown) {
  if (clients.size === 0) {
    return
  }

  const payload = encoder.encode(`data: ${JSON.stringify(update)}\n\n`)

  for (const controller of Array.from(clients)) {
    try {
      controller.enqueue(payload)
    } catch (error) {
      console.error('WhatsApp SSE broadcast error:', error)
      clients.delete(controller)
    }
  }
}
