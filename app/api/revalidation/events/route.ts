
export async function POST(request: Request) {


    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
        return new Response(null, { status: 400 });
    }
}