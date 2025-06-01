// pages/ar.js
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const RealisticARPreview = dynamic(
  () => import('../components/RealisticARPreview'),   // same folder import
  { ssr: false }
);

export default function ARPage() {
  const { query } = useRouter();
  const { image } = query;           // passed as .../ar?image=<url>
  return image ? (
    <RealisticARPreview imageUrl={image} onClose={() => history.back()} />
  ) : null;
}
