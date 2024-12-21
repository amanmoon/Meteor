'use client';
import { useRouter } from 'next/navigation';
import { createMeet } from './[meet]/services';

export default function Page() {

  const router = useRouter();
  const goToMeet = async () => {
    try {
      const id = await createMeet()
      router.push(id);
    } catch (error) {
      console.log("error creating meet: ", error);
    }
  };

  return (<>
    <button onClick={goToMeet}>Create Meet</button></>)
}