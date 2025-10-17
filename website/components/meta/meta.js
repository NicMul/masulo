/***
*
*   META
*   Header component for page metadata
*
*   PROPS
*   card: social preview image url (string, required)
*   description: page description (string, required)
*   keywords: keywords (array, required)
*   path: path of the page (string, required)
*   title: page title (string, required)
*
**********/

import Head from 'next/head';

export function Meta(props){
  
  return (
    <Head>
      <title>{ props.title }</title>
      <meta charSet='utf-8' />
      <meta name='keywords' content={ props.keywords.toString() } />
      <meta name='description' content={ props.description }/>

      <meta key='og:url' property='og:url' content={ `${process.env.NEXT_PUBLIC_URL}${props?.path}` }/>
      <meta property='og:title' content={ props.title }/>
      <meta property='og:description' content={ props.description }/>
      <meta property='og:image' content={ props.card }/>

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={ props.title }/>
      <meta name='twitter:description' content={ props.description }/>
      <meta name='twitter:image' content={ props.card }/>
      <link rel='shortcut icon' href='/favicon.ico' />
      
    </Head>
  )
}