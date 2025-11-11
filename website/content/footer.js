const content = {
  copyright: `Copyright © Mesulo Zero Ltd. ${new Date().getFullYear()}`,
  address: '19 Anytown Street, Anytown, United Kingdom.',
  nav: [
    {
      title: 'Resources',
      items: [
        { text: 'Pricing', url: '/pricing' },
        { text: 'Sign In', url: `${process.env.NEXT_PUBLIC_URL}/signin` },
        { text: 'Sign Up', url: `${process.env.NEXT_PUBLIC_URL}/signup` }
      ]
    },
    {
      title: 'Legal',
      items: [
        { text: 'Terms', url: '/terms' },
        { text: 'Privacy', url: '/privacy' },
      ]
    },
    { 
      title: 'Connect',
      items: [
        { icon: 'twitter', url: 'https://twitter.com' },
        { icon: 'facebook', url: 'https://facebook.com' },
        { icon: 'instagram', url: 'https://instagram.com' }
      ]
    }
  ]
}

export default content;