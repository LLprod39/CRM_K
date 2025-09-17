import { NextRequest } from 'next/server'
import { registerWhatsAppClient, unregisterWhatsAppClient } from '@/lib/whatsappEvents'

const encoder = new TextEncoder()

// SSE endpoint
export async function GET(request: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      registerWhatsAppClient(controller)

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to WhatsApp updates' })}

`))

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}

`))
        } catch (error) {
          clearInterval(heartbeat)
          unregisterWhatsAppClient(controller)
        }
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unregisterWhatsAppClient(controller)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
