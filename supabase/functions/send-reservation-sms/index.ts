import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReservationNotification {
  customerName: string;
  eventName: string;
  eventDate: string;
  reservationType: string;
  partySize: number;
  customerPhone: string;
  customerEmail: string;
  reservationId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFromPhone = Deno.env.get("TWILIO_FROM_PHONE");

    if (!twilioAccountSid || !twilioAuthToken || !twilioFromPhone) {
      console.log("Twilio credentials not configured. SMS notification skipped.");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Twilio not configured. Please set up Twilio credentials in Supabase Edge Function secrets." 
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { toPhone, reservation } = await req.json() as { 
      toPhone: string; 
      reservation: ReservationNotification 
    };

    if (!toPhone || !reservation) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const typeLabels: Record<string, string> = {
      guest_list: "Guest List",
      section: "VIP Table",
      bottle_service: "Bottle Service",
      special_event: "Special Event",
    };

    const message = `New Reservation Alert!\n\nCustomer: ${reservation.customerName}\nEvent: ${reservation.eventName}\nDate: ${new Date(reservation.eventDate).toLocaleDateString()}\nType: ${typeLabels[reservation.reservationType] || reservation.reservationType}\nParty Size: ${reservation.partySize}\nPhone: ${reservation.customerPhone}\nEmail: ${reservation.customerEmail}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const formData = new URLSearchParams();
    formData.append("To", toPhone);
    formData.append("From", twilioFromPhone);
    formData.append("Body", message);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to send SMS",
          error: twilioData 
        }),
        {
          status: twilioResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "SMS sent successfully",
        twilioMessageSid: twilioData.sid 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending SMS:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});