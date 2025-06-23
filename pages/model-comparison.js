import Layout from '../components/Layout';
import SEO from '../components/SEO';
import ModelComparison from '../components/ModelComparison';

export default function ModelComparisonPage() {
  return (
    <Layout
      title="Model Comparison"
      description="Compare AI tattoo generation between our standard model and the new Fresh Ink model with side-by-side results."
    >
      <SEO 
        title="AI Tattoo Model Comparison  - Standard vs FreshInk"
        description="Compare tattoo generation between our standard AI model and the new Fresh Ink model. See how prompt truncation affects results."
        keywords="ai tattoo model comparison, fresh ink model, tattoo generation comparison, ai model testing"
        canonicalUrl="https://tattoodesignsai.com/model-comparison"
      />
      <ModelComparison />
    </Layout>
  );
} 