const content = {
  hero: {
    title: 'AI iGaming Asset Management to Boost Player Engagement',
    subtitle: 'Instantly hot swap casino game thumbnails and A/B Test for higher conversion, all without touching your CMS or rebuilding your sites or apps.',
    image: {
      width: 1024,
      height: 567,
      src: '/images/placeholder.jpg',
      alt: 'Mesulo dashboard showing casino game thumbnail performance and live A/B testing',
      priority: true,
      placeholder: 'blur'
    },
    actions: [
      { text: 'Request Demo', url: `${process.env.NEXT_PUBLIC_URL}/demo` },
      { text: 'Start Free Trial', url: `${process.env.NEXT_PUBLIC_URL}/signup` }
    ],
    rating: {
      stars: 5,
      site: {
        name: 'iGaming Pro Reviews',
        url: 'https://igamingpro.reviews'
      }
    }
  },
  testimonials: {
    title: 'Trusted by Top-Tier iGaming Operators',
    descrition: 'Our clients see an average of 25% higher CTR within the first 60 days of use.',
    list: [
      {
        author: 'Sarah J.',
        role: 'Casino Manager',
        text: "Mesulo is a game-changer. We can A/B test a new slot thumbnail in minutes and instantly see a an uplift in engagement. It's the fastest way to optimize our lobby.",
        image: '/images/testimonials/sarah-jonhson.jpg'
      },
      {
        author: 'Mark L.',
        role: 'Chief Product Officer',
        text: "The AI creative tool is phenomenal. It generates 5-second animated thumbnails that perform better than anything our design team produces manually. Massive time saver.",
        image: '/images/testimonials/alex-parker.jpg'
      },
      {
        author: 'David V.',
        role: 'Head of CRM',
        text: "Before Mesulo, updating one campaign asset took two days of dev work. Now, it's a live hot swap tied to real-time performance data. True operational efficiency.",
        image: '/images/testimonials/david-nguyen.jpg'
      },
    ],
  },
  features: {
    title: 'Core Features Built for iGaming Conversion',
    description: 'Eliminate development friction and drive player engagement with intelligent assets.',
    list: [
      {
        icon: 'shuffle',
        title: 'Hot Swap Assets Instantly',
        description: 'Update any game thumbnail or video live without needing to rebuild or redeploy your CMS.',
      },
      {
        icon: 'activity',
        title: 'Real-Time Engagement Data',
        description: 'Measure the performance, clicks, and revenue of every asset on your entire platform instantly.',
      },
      {
        icon: 'wifi',
        title: 'Zero-Code SDK Integration',
        description: 'A single, lightweight SDK import is all it takes—no complex API configuration or lengthy setup required.',
      },
      {
        icon: 'smartphone',
        title: 'Auto-Optimized Assets',
        description: 'Images and videos are automatically compressed and delivered for perfect web and mobile load speed.',
      },
      {
        icon: 'zap',
        title: 'AI Creative Model',
        description: 'Generate new, high-converting thumbnail images and video animations using our custom-trained AI.',
      },
      {
        icon: 'trending-up',
        title: 'Seamless A/B Testing',
        description: 'Launch multivariate asset tests with ease and automatically direct traffic to the winning variant.',
      },
      {
        icon: 'speaker',
        title: 'Campaign & Promotion Links',
        description: 'Tie specific promotional assets and badges directly to active marketing campaigns in a unified dashboard.',
      },
      {
        icon: 'share',
        title: 'Global CDN Delivery',
        description: 'Assets are served globally via CDN, ensuring 99.9% uptime and lightning-fast delivery worldwide.',
      },
      {
        icon: 'image',
        title: 'Unified Asset Library',
        description: 'Centralize all your casino creative content in one hub for effortless management and deployment.',
      },
      {
        icon: 'user',
        title: 'Role-Based User Access',
        description: 'Control who can edit, approve, and publish assets with custom team permissions.',
      },
      {
        icon: 'mic',
        title: 'API Access for Automation',
        description: 'Advanced API available for programmatic asset management and large-scale operational use.',
      },
      {
        icon: 'disc',
        title: 'Localisation Ready',
        description: 'Manage and test localized asset versions to maximize performance in different geographical markets.',
      },
    ]
  },
  how_it_works: {
    title: 'Get Instant Asset Control in 3 Simple Steps',
    description: 'Mesulo is designed for zero friction. Go from signup to live optimization in under an hour.',
    steps: [
      { title: 'Import SDK', description: 'Copy and paste our single-line SDK into your casino platform’s front-end code once.' },
      { title: 'Upload & Create Assets', description: 'Upload new thumbnails or use our AI to generate high-performing animated asset variations.' },
      { title: 'Hot Swap & Optimize', description: 'Instantly publish new assets, launch an A/B test, and watch your player engagement metrics rise.' }
    ],
    image: {
      width: 1024,
      height: 567,
      src: '/images/placeholder.jpg',
      alt: 'Diagram showing Mesulo SDK connecting front-end to asset control panel',
      priority: true,
      placeholder: 'blur'
    },
  },
  faqs: {
    title: 'Frequently Asked Questions',
    description: 'Find detailed answers on Mesulo’s functionality, integration, and operational benefits.',
    items: [
      { q: 'How long does integration take?',
        a: 'Integration is non-intrusive and only requires a single-line SDK import. Most clients are live and testing assets within 60 minutes.'
      },
      {
        q: 'Do I need to rebuild my CMS for every asset change?',
        a: 'No. Mesulo completely decouples asset changes from your CMS, allowing instant hot swaps without any development work or rebuilds.'
      },
      {
        q: 'Does Mesulo slow down my platform or app?',
        a: 'Absolutely not. All assets are optimized and delivered via a high-performance CDN, often improving your page speed scores.'
      },
      {
        q: 'What is the custom AI model used for?',
        a: 'Our AI model generates new, perfectly sized, and animated high-conversion thumbnails/videos from your static game art, saving creative production time.'
      },
      {
        q: 'Can I use Mesulo to run seasonal campaigns?',
        a: 'Yes, you can tie specific promotional assets (like holiday badges) to campaigns and instantly swap them live for the duration of the event.'
      },
      {
        q: 'What kind of data does Mesulo track?',
        a: 'We track real-time engagement data including Click-Through-Rate (CTR), asset impressions, and conversions, tied directly to specific assets.'
      },
    ]
  },
  cta: {
    title: 'Stop Being Average. Boost Your Engagement.',
    description: 'Request a free performance audit and demo to see Mesulo’s impact on your lobby today.',
    actions: [
      { text: 'Request Demo', url: `${process.env.NEXT_PUBLIC_URL}/demo` },
      { text: 'Get Started', url: `${process.env.NEXT_PUBLIC_URL}/signup` }
    ],
  }
}

export default content;