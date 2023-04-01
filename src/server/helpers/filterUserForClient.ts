import type { User } from "@clerk/nextjs/dist/api";
import { TRPCError } from "@trpc/server";
export const filterUserForClient = (user: User) => {
  if (!user.username) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Username not found",
    });
  }

  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};
