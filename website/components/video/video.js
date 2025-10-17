import Style from './video.module.scss';

export function Video(props){

  const embed = props.url.includes('youtube') || props.url.includes('vimeo');
  let url = props.url;

  if (props.autoplay)
    url += '?&autoplay=1&mute=1'
    
  if (embed){
    return (
      <div className={ Style.embed }>
        <iframe
          title='video'
          src={ url }
          frameBorder='0'
          allow='autoplay; fullscreen'
          allowFullScreen>
        </iframe> 
      </div>
    )
  }

  return (
    <div className={ Style.player }>
      <video controls poster={ props.thumbnail } src={ props.url }/>
    </div>
  )
}
