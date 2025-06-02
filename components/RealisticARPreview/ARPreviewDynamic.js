// components/RealisticARPreview/ARPreviewDynamic.js
import dynamic from 'next/dynamic';

const RealisticARPreview = dynamic(
  () => import('./RealisticARPreview'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading AR Preview...</p>
        </div>
      </div>
    )
  }
);

export default RealisticARPreview;