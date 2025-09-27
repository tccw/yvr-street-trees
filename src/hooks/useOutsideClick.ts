import { useState, useEffect, useRef } from 'react';

// https://stackoverflow.com/questions/32553158/detect-click-outside-react-component
export const useComponentVisible = (initialIsVisible: boolean) => {
    const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible);
    const ref = useRef(null);

    /** If the ref doesn't container our component, set the component to no visible */
    const handleClickOutside = (event: { target: any; }) => {
        //@ts-ignore
        if (ref.current && !ref.current.contains(event.target)) {
            setIsComponentVisible(false);
        }
    };

    useEffect(() => {
        /** add listener for entire document */
        document.addEventListener('click', handleClickOutside, true);
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('touchstart', handleClickOutside, true);
        return () => {
            /** clean up by removing the listener */
            document.removeEventListener('click', handleClickOutside, true);
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('touchstart', handleClickOutside, true);
        };
    });

    return { ref, isComponentVisible, setIsComponentVisible };
}