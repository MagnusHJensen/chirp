import { Clerk, DeletedObjectJSON, UserJSON } from "@clerk/clerk-sdk-node";
import { buffer } from "micro";
import { type NextApiRequest, type NextApiResponse } from "next";
import { Webhook } from "svix";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

type UserCreationEvent = {
  data: UserJSON;
  object: "event";
  type: "user.created";
};

type UserDeletionEvent = {
  data: DeletedObjectJSON;
  object: "event";
  type: "user.deleted";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const payload = (await buffer(req)).toString();
  const headers = req.headers;

  const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);
  let msg;
  try {
    msg = wh.verify(payload, headers as unknown as Record<string, string>) as
      | UserCreationEvent
      | UserDeletionEvent;
  } catch (err) {
    res.status(400).json({});
  }

  if (!msg) {
    res.status(400).json({});
    return;
  }

  if (isUserCreationEvent(msg)) {
    const data = msg.data;
    const email = msg.data.email_addresses.find(
      (email) => email.id === data.primary_email_address_id
    );

    if (!email) {
      res.status(400).json({});
      return;
    }

    await prisma.user.create({
      data: {
        clerkId: data.id,
        email: email.email_address,
        name: `${data.first_name} ${data.last_name}`,
      },
    });
  } else if (isUserDeletionEvent(msg)) {
    await prisma.user.deleteMany({
      where: {
        clerkId: msg.data.id,
      },
    });
  }

  res.json({});
}

function isUserCreationEvent(
  msg: UserCreationEvent | UserDeletionEvent
): msg is UserCreationEvent {
  return msg.type === "user.created";
}

function isUserDeletionEvent(msg: UserDeletionEvent): msg is UserDeletionEvent {
  return msg.type === "user.deleted";
}
