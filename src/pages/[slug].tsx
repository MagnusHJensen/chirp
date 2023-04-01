import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

type ProfileFeedProps = {
  authorId: string;
};
const ProfileFeed = ({ authorId }: ProfileFeedProps) => {
  const { data, isLoading } = api.posts.getPostsByAuthorId.useQuery({
    authorId,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data || data.length === 0) return <div>User has not made any posts</div>;

  return (
    <div className="flex flex-col">
      {data.map((post) => (
        <PostView key={post.post.id} {...post} />
      ))}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            width={128}
            height={128}
            alt={`${data.username}'s profile picture`}
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-black bg-black"
          />
        </div>
        <div className="h-[64px]" />
        <div className="p-4 text-2xl font-bold">{`@${data.username}`}</div>
        <div className="w-full border-b border-slate-400" />
        <ProfileFeed authorId={data.id} />
      </PageLayout>
    </>
  );
};

import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { LoadingPage } from "~/components/loading-spinner";
import { PostView } from "~/components/post-view";
import { generateSSGHelper } from "~/server/helpers/ssg-helper";

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("No slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default ProfilePage;
