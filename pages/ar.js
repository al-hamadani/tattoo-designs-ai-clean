// pages/ar.js
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const RealisticARPreview = dynamic(
  () => import('../components/RealisticARPreview'),   // same folder import
  { ssr: false }
);

export default function ARPage() {
  const router = useRouter();
  const { image } = router.query; // passed as .../ar?image=<url>

  return image ? (
    <RealisticARPreview imageUrl={image} onClose={() => router.back()} />
  ) : null;
}
