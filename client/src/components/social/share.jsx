/***
*
*   SOCIAL SHARING BUTTONS
*   A sharing wiget for Facebook, Twitter, Linkedin and email.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/social
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   description: text for the social media post (string, required)
*   url: url of page to share (string, required)
*
**********/

import { Button, cn } from 'components/lib';

export function SocialShare({ url, description, className }){

  const networks = { 

    facebook: `https://www.facebook.com/share.php?u=${url}`,
    x: `https://x.com/share?text=${description}&url=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    mail: `mailto:?subject=You must see this!&body=${description}%0D%0A%0D%0A${url}`

  };

  return (
    <div className={ cn(className) }>
      
      { Object.keys(networks).map((key, i) => {

        return (
          <Button
            key={ key } 
            icon={ key }
            variant='outline' 
            className='mr-1 last:mr-0'
            url={ networks[key] }
          />
        );
      })}
    </div>
  );
}

