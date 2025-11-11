/***
*
*   AVATAR
*   An image element with a fallback for representing the user.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/avatar
*   https://ui.shadcn.com/docs/components/avatar
*
*   PROPS
*   className: custom class (SCSS or tailwind style, optional)
*   fallback: fallback text (string, optional)
*   src: image source URL (string, required)
*
**********/

import { forwardRef }from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from 'components/lib'

const Avatar = forwardRef(({ className, ...props }, ref) => (

  <AvatarPrimitive.Root ref={ ref } className={ cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className) } {...props }>

    { props.src && 
      <AvatarImage {...props } /> 
    }

    { props.fallback && 
     <AvatarFallback {...props } /> 
    }

  </AvatarPrimitive.Root>
))

Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = forwardRef(({ className, ...props }, ref) => (

  <AvatarPrimitive.Image ref={ ref } className={ cn('aspect-square h-full w-full !ml-0', className) } {...props } />

))

AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = forwardRef(({ className, fallback, ...props }, ref) => (

  <AvatarPrimitive.Fallback ref={ ref } className={ cn('flex h-full w-full items-center justify-center text-md text-white rounded-full bg-primary !ml-0 uppercase', className) } {...props }>
    { fallback }
  </AvatarPrimitive.Fallback>

))

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName
export { Avatar, AvatarImage, AvatarFallback }
