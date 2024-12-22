'use client';
import { useRouter } from 'next/navigation';
import { createMeet } from './[meet]/services';
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';


export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();
  const goToMeet = async () => {
    try {
      const id = await createMeet()
      router.push(id);
    } catch (error) {
      console.log("error creating meet: ", error);
    }
  };
  function OAuthGoogleSignIn() {
    signIn('google');
  }

  function OAuthSignOut() {
    signOut();
  }
  console.log(session);
  return (
    <>
      <button onClick={goToMeet}>Create Meet</button>
      <h1>Hello, Next.js!</h1>

      {!session ? (<>
        <button onClick={OAuthGoogleSignIn}>Sign In with Google</button>
      </>
      ) : (
        <>
          <button onClick={OAuthSignOut}>Sign Out</button>
          {session.user.image && (<>
            <img
              src={session.user.image}
              style={{ width: '1000px', height: '1000px', borderRadius: '50%' }}
            /></>
          )}
        </>
      )}
    </>
  );
}