import PortableText from "react-portable-text";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { useForm, SubmitHandler } from "react-hook-form";

function Post({ post }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    await fetch("/api/createComment", {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then(() => {
        console.log(data);
      })
      .catch((err) => console.error(err));
  };
  return (
    <main>
      <Header />

      <img
        className="w-full h-40 object-cover"
        src={urlFor(post.mainImage).url()}
        alt="post-image"
      />

      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <div>
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()}
            alt=""
          />
          <p className="text-sm font-light">
            Blog post by{" "}
            <span className="text-green-600">{post.author.name}</span> -
            Published at {new Date(post._createdAt).toLocaleString()}{" "}
          </p>
        </div>
        <div className="mt-5">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={post.body}
            serializers={{
              h1: () => <h1 className="text-2xl font-bold my-5" {...props} />,
            }}
          />
        </div>
      </article>

      <hr className="max-w-lg my-5 mx-auto border border-yellow-500" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col p-5 max-w-2xl mx-auto mb-10"
      >
        <h3 className="text-sm text-yellow-500">Enjoyed the article?</h3>
        <h4 className="text-3xl font-bold">Leave a comment Below</h4>
        <hr className="py-3 mt-2" />
        <label className="flex flex-col mb-5">
          <span className="text-gray-700">Name</span>
          <input
            {...register("name", { required: true })}
            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:ring outline-none"
            placeholder="John Doe"
            type="text"
          />
        </label>
        <label className="flex flex-col mb-5">
          <span className="text-gray-700">Email</span>
          <input
            {...register("email", { required: true })}
            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:ring outline-none"
            placeholder=""
            type="email"
          />
        </label>
        <label className="flex flex-col mb-5">
          <span className="text-gray-700">Comment</span>
          <textarea
            {...register("comment", { required: true })}
            className="outline-none shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 focus:ring"
            placeholder=""
            type="text"
            rows={8}
          />
        </label>

        {/* errors will return if validation fails */}
        <div className="flex flex-col p-5">
          {errors.name && (
            <span className="text-red-500">- The Name field is required</span>
          )}
          {errors.email && (
            <span className="text-red-500">- The Email field is required</span>
          )}
          {errors.comment && (
            <span className="text-red-500">
              - The Comment field is required
            </span>
          )}
        </div>

        <input
          className="bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
          type="submit"
        />
      </form>
    </main>
  );
}

export default Post;

export const getStaticPaths = async () => {
  const query = `*[_type == 'post']{
        _id,
        slug{
            current
        }
    }`;
  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post) => ({
    params: {
      slug: post.slug.current,
    },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps = async ({ params }) => {
  const query = `*[_type == 'post' && slug.current == $slug][0]{
            _id,
            _createdAt,
            mainImage,
            title,
            author ->{
                name,
                image
            },
            body
    }`;

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  });

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },

    revalidate: 60, // after 60 seconds use ISR to update page
  };
};
