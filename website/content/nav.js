const content = [
  {
    name: 'Features',
    url: '/#features',
    type: 'text',
  },
  { 
    name: 'Pricing',
    url: '/pricing',
    type: 'text',
  },
  { 
    name: 'FAQs',
    url: '/#faqs',
    type: 'text',
  },
  {
    name: 'Contact',
    url: '/contact',
    type: 'text'
  },
  {
    name: 'Sign In',
    url: `${process.env.NEXT_PUBLIC_URL}/signin`,
    type: 'button'
  }
]

export default content;