  // demo plans
  
  const plans = [
  {
    id: 'startup_monthly',
    name: 'Startup',
    type: 'free',
    interval: 'month',
    price: 0,
    currency: {
      name: 'usd',
      symbol: '$'
    },
    features: [
      {
        name: 'Awesome feature',
        checked: true
      },
      {
        name: 'Another amazing feature',
        checked: true
      },
      {
        name: 'The best feature ever',
        checked: true
      }
    ]
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    type: 'standard',
    price: 10,
    highlight: true,
    interval: 'month',
    currency: {
      name: 'usd',
      symbol: '$'
    },
    features: [
      {
        name: 'Awesome feature',
        checked: true
      },
      {
        name: 'Another amazing feature',
        checked: true
      },
      {
        name: 'The best feature ever',
        checked: true
      }
    ]
  },
  {
    id: 'unicorn_monthly',
    name: 'Unicorn',
    type: 'standard',
    price: 20,
    interval: 'month',
    currency: {
      name: 'usd',
      symbol: '$'
    },
    features: [
      {
        name: 'Awesome feature',
        checked: true
      },
      {
        name: 'Another amazing feature',
        checked: true
      },
      {
        name: 'The best feature ever',
        checked: true
      }
    ]
  },
  {
    id: 'startup_annual',
    name: 'Startup',
    type: 'free',
    interval: 'year',
    price: 0,
    currency: {
      name: 'usd',
      symbol: '$'
    },
    features: [
      {
        name: 'Awesome feature',
        checked: true
      },
      {
        name: 'Another amazing feature',
        checked: true
      },
      {
        name: 'The best feature ever',
        checked: true
      }
    ]
  },
  {
    id: 'pro_annual',
    name: 'Pro',
    type: 'standard',
    price: 100,
    highlight: true,
    interval: 'year',
    currency: {
      name: 'usd',
      symbol: '$'
    },
    features: [
      {
        name: 'Awesome feature',
        checked: true
      },
      {
        name: 'Another amazing feature',
        checked: true
      },
      {
        name: 'The best feature ever',
        checked: true
      }
    ]
  },
  {
    id: 'unicorn_yearly',
    name: 'Unicorn',
    type: 'standard',
    price: 200,
    interval: 'year',
    currency: {
      name: 'usd',
      symbol: '$'
    },
    features: [
      {
        name: 'Awesome feature',
        checked: true
      },
      {
        name: 'Another amazing feature',
        checked: true
      },
      {
        name: 'The best feature ever',
        checked: true
      }
    ]
  }
]

export default plans;