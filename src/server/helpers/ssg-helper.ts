import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { type SignedOutAuthObject } from "@clerk/nextjs/dist/api";
import superjson from "superjson";

export const generateSSGHelper = () => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, auth: {} as unknown as SignedOutAuthObject },
    transformer: superjson,
  });

  return ssg;
};
