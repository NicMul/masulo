/***
*
*   HEADER
*   Header section with title and children.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/header
*
*   PROPS
*   children: children to render (component(s), optional)
*   title: title of the view (string, optional)
*
**********/

export function Header({ title, children }){

  return (
    <header className='fixed top-0 left-0 right-0 font-semibold z-40 p-4 bg-white sm:bg-transparent sm:py-6 sm:px-0 sm:text-xl sm:relative dark:bg-slate-900 dark:border-b dark:border-slate-800 sm:text-left border-b border-slate-200 mb-8 flex justify-between text-center items-center'>

      { title && 
        <h1 className="flex-grow text-center sm:text-left">
          { title }
        </h1> 
      }

      { children }

    </header>
  );
}
