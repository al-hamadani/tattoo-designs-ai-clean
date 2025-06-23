import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';

export default function Pricing() {
  const [loading, setLoading] = useState(null);

  const plans = [
    {
      name: 'Weekly Pro',
      price: '$4.99',
      period: '/week',
      priceId: 'price_1Rd5EHQ2JCu3xBpSSQKJhggK',
      description: 'Perfect for trying out unlimited generations',
      features: [
        'Unlimited tattoo generations',
        'All styles and customizations',
        'High-quality downloads',
        'No daily limits',
        'Priority support'
      ],
      popular: false,
      color: 'blue'
    },
    {
      name: 'Monthly Pro',
      price: '$9.99',
      period: '/month',
      priceId: 'price_1Rd5FNQ2JCu3xBpSWChkX2un',
      description: 'Most popular choice for regular users',
      features: [
        'Unlimited tattoo generations',
        'All styles and customizations',
        'High-quality downloads',
        'No daily limits',
        'Priority support',
        'Advanced AI models'
      ],
      popular: true,
      color: 'purple'
    },
    {
      name: 'Yearly Pro',
      price: '$99.99',
      period: '/year',
      priceId: 'price_1Rd5GmQ2JCu3xBpSDrPzs6Xw',
      description: 'Best value - save $20 compared to monthly',
      features: [
        'Unlimited tattoo generations',
        'All styles and customizations',
        'High-quality downloads',
        'No daily limits',
        'Priority support',
        'Advanced AI models',
        'Early access to new features'
      ],
      popular: false,
      color: 'green',
      savings: 'Save $20'
    }
  ];

  const handleSubscribe = async (priceId, planName) => {
    try {
      setLoading(priceId);
      
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  const getColorClasses = (color, isPopular = false) => {
    if (isPopular) {
      return {
        border: 'border-purple-200',
        bg: 'bg-gradient-to-br from-purple-50 to-blue-50',
        button: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
        badge: 'bg-gradient-to-r from-purple-600 to-blue-600'
      };
    }

    const colors = {
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50/50',
        button: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-600'
      },
      green: {
        border: 'border-green-200',
        bg: 'bg-green-50/50',
        button: 'bg-green-600 hover:bg-green-700',
        badge: 'bg-green-600'
      }
    };

    return colors[color] || colors.blue;
  };

  return (
    <>
      <Head>
        <title>Pricing - TattooDesignsAI</title>
        <meta name="description" content="Choose your TattooDesignsAI plan. Get unlimited AI-generated tattoo designs with our Pro subscription." />
        <meta name="keywords" content="tattoo pricing, ai tattoo subscription, unlimited tattoo designs" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <Sparkles className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold">TattooDesignsAI</span>
              </Link>
              <Link href="/generate" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Back to Generator
              </Link>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Unlock unlimited AI-generated tattoo designs with our Pro subscription. 
              No more daily limits, endless creativity.
            </p>
            
            {/* Free vs Pro Comparison */}
            <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200 mb-12">
              <div className="px-4 py-2 text-gray-600">
                <span className="font-medium">Free:</span> 3 designs/day
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md font-medium">
                <Crown className="w-4 h-4 inline mr-1" />
                Pro: Unlimited
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const colorClasses = getColorClasses(plan.color, plan.popular);
              const isLoading = loading === plan.priceId;

              return (
                <div
                  key={plan.name}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 ${colorClasses.border} ${colorClasses.bg} overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 left-0">
                      <div className={`${colorClasses.badge} text-white text-center py-2 text-sm font-medium`}>
                        <Crown className="w-4 h-4 inline mr-1" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {plan.savings && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {plan.savings}
                    </div>
                  )}

                  <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-6">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price}
                        </span>
                        <span className="text-lg text-gray-500 ml-1">
                          {plan.period}
                        </span>
                      </div>
                      {plan.name === 'Yearly Pro' && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          Just $8.33/month billed annually
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(plan.priceId, plan.name)}
                      disabled={isLoading}
                      className={`w-full ${colorClasses.button} text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Get {plan.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="max-w-3xl mx-auto grid gap-6">
              {[
                {
                  q: "Can I cancel anytime?",
                  a: "Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment system."
                },
                {
                  q: "Is there a free trial?",
                  a: "Every user gets 3 free generations daily. This allows you to test our AI before upgrading to unlimited access."
                },
                {
                  q: "Do you offer refunds?",
                  a: "We offer a 7-day satisfaction guarantee. If you're not happy with your Pro subscription, contact us for a full refund."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center space-x-8 text-gray-500">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>7-Day Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 