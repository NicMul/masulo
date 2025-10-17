const content = {
  hero: {
    title: 'Write Your Value Proposition Here, Include The Main SEO Keyword',
    subtitle: 'Explain more here, give users a reason to scroll down.',
    image: {  
      
      width: 1024, 
      height: 567, 
      src: '/images/placeholder.jpg',
      alt: 'Description of your hero image, including primary keyword',
      priority: true,
      placeholder: 'blur'
    
    },
    // video: { 
    //   url: 'YOUR_VIDEO_LINK.mp4',
    //   thumbnail: 'YOUR_VIDEO_THUMBNAIL.jpg'
    //  },
    actions: [
      { text: 'Sign Up', url: `${process.env.NEXT_PUBLIC_URL}/signup` },
      { text: 'Try Demo', url: `${process.env.NEXT_PUBLIC_URL}/demo` }
    ],
    rating: {
      stars: 5,
      site: {
        name: 'Trustpilot',
        url: 'https://trustpilot.com'
      }
    }
  },
  testimonials: {
    title: 'Trusted by 500+ Customers',
    descrition: 'They saved over $500 each compared to other popular competitors',
    list: [
      {
        author: 'Sarah Johnson',
        role: 'CEO, Acoustic Harmony Records',
        url: 'https://usegravity.app',
        text: `I've tried numerous music streaming apps. This is the game-changer I've been waiting for. It offers the perfect blend of discoverability and personalization.`,
        image: '/images/testimonials/sarah-jonhson.jpg'
      },
      {
        author: 'Alex Parker',
        role: 'Music Blogger',
        text: `I've been a music blogger for years, and Beatbox has simplified my music discovery process. It's intuitive, and the personalized playlists keep my readers engaged.`,
        image: '/images/testimonials/alex-parker.jpg'
      },
      {
        author: 'David Nguyen',
        role: 'Artist at GrooveMakers',
        text: `Being an independent artist, Beatbox has given me the platform to reach a broader audience. The seamless sharing features and analytics have been a game-changer for my music career.`,
        image: '/images/testimonials/david-nguyen.jpg'
      },
    ],
  },
  features: {
    title: 'Features',
    description: 'Discover endless possibilities',
    list: [
      {
        icon: 'play',
        title: 'Personalized Playlists',
        description: 'Tailored playlists based on your music preferences.',
      },
      {
        icon: 'activity',
        title: 'High-Quality Streaming',
        description: 'Enjoy your favorite tracks in crystal clear quality.',
      },
      {
        icon: 'wifi',
        title: 'Offline Listening',
        description: 'Download and listen to music without an internet connection.',
      },
      {
        icon: 'smartphone',
        title: 'Cross-Platform Sync',
        description: 'Access your music library anytime, on all your devices.',
      },
      {
        icon: 'list',
        title: 'Curated Playlists',
        description: 'Discover new tracks with expertly crafted playlists.',
      },
      {
        icon: 'book',
        title: 'Multi-Genre Library',
        description: 'Explore a vast collection of music genres from classical to trance.',
      },
      {
        icon: 'speaker',
        title: 'Lyrics',
        description: 'Sing along to your favourite songs with synchronized lyrics.',
      },
      {
        icon: 'share',
        title: 'Social Sharing',
        description: 'Share your favorite songs with friends  an family effortlessly.',
      },
      {
        icon: 'headphones',
        title: 'Podcast Hub',
        description: 'Stream a wide range of podcasts on various topics.',
      },
      {
        icon: 'user',
        title: 'Artist Insights',
        description: 'Get to know your favorite artists with exclusive content.',
      },
      {
        icon: 'mic',
        title: 'Voice Commands',
        description: 'Hands-free music control with with voice activation.',
      },
      {
        icon: 'disc',
        title: 'Mixtapes',
        description: 'Craft your personalized mixtapes and share them with the world.',
      },
    ]
  },
  how_it_works: {
    title: 'How It Works',
    description: 'Get set up in 3 simple steps',
    steps: [
      { title: 'Sign Up', description: 'Create an account, and start exploring your personalized music journey.' },
      { title: 'Customize Your Profile', description: 'Tell us your music preferences, and we\'ll do the rest.' },
      { title: 'Dive into the World of Music', description: 'Stream, discover, and share your favorite tunes with the world.' }
    ],
     // video: { 
    //   url: 'YOUR_VIDEO_LINK.mp4',
    //   thumbnail: 'YOUR_VIDEO_THUMBNAIL.jpg'
    //  },
    image: {  
      
      width: 1024, 
      height: 567, 
      src: '/images/placeholder.jpg',
      alt: 'Description of your explainer image or video',
      priority: true,
      placeholder: 'blur'
    
    },
  },
  faqs: {
    title: 'Frequently Asked Questions',
    description: 'If you have further question, please contact us',
    items: [
      { q: 'Is there a free trial available?',
        a: 'Yes, you can enjoy a 14-day free trial of our Premium tier to experience all the features.'
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel your subscription at any time, and there are no cancellation fees.'
      },
      {
        q: 'Is offline listening available?',
        a: 'Offline listening is available for most songs, but some tracks may be restricted due to licensing agreements.'
      },
      {
        q: 'How can I contact customer support?',
        a: 'Our support team is available 24/7. You can contact us through our website or email.'
      },
      {
        q: 'Can I share my playlists with friends?',
        a: 'Yes, you can share your playlists with friends via social sharing features.'
      },
      {
        q: 'Do you offer student discounts?',
        a: 'Yes, we offer special discounts for eligible students.'
      }, 
    ]
  },
  cta: {
    title: 'Write a Short, Snappy CTA Headline Here',
    description: '30 day free trial. No credit card required.',
    actions: [
      { text: 'Sign Up', url: `${process.env.NEXT_PUBLIC_URL}/signup` },
      { text: 'Try Demo', url: `${process.env.NEXT_PUBLIC_URL}/demo` }
    ],
  }
}

export default content;