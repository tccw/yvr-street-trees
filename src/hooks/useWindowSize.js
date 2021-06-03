import { useState, useEffect } from 'react';


// https://stackoverflow.com/questions/46586165/react-conditionally-render-based-on-viewport-size
export const useWindowSize = (queryWidth) => {
    const [isNarrow, setIsNarrow] = useState(window.innerWidth <= queryWidth);

    const updateQuery = () => {
        setIsNarrow(window.innerWidth <= queryWidth);
    }

    useEffect(() => {
        window.addEventListener("resize", updateQuery);
        return () => {
            window.removeEventListener("resize", updateQuery);
        }
    }, [queryWidth]) // no dependencies?

    return isNarrow
}