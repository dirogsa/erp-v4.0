import { useEffect, useRef } from 'react';

/**
 * Custom hook to dynamically update the document title and restore it upon unmount.
 *
 * @param {string} title - The title to set.
 * @param {boolean} [retainOnUnmount=false] - If true, the title won't be restored when unmounting.
 */
export function useDocumentTitle(title, retainOnUnmount = false) {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  useEffect(() => {
    return () => {
      if (!retainOnUnmount) {
        document.title = defaultTitle.current;
      }
    };
  }, [retainOnUnmount]);
}
