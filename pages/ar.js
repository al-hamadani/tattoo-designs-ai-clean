// pages/ar.js
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const RealisticARPreview = dynamic(
  () => import('../components/RealisticARPreview/RealisticARPreview'),
  { ssr: false }
);

export default function ARPage() {
  const router = useRouter();
  const { image } = router.query;

  return image ? (
    <RealisticARPreview
      imageUrl={image}
      onClose={() => router.back()}
    />
  ) : null;
}