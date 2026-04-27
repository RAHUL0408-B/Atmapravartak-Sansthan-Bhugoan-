/**
 * Service to handle transliteration (English -> Marathi)
 * Uses Google Input Tools API (unofficial)
 */

export const transliterateToMarathi = async (text) => {
    if (!text) return '';
    try {
        const response = await fetch(
            `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=mr-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`
        );
        const data = await response.json();

        // Response format: ["SUCCESS", [["input", ["suggestion1", "suggestion2"]]]]
        if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
            return data[1][0][1][0];
        }
        return text;
    } catch (error) {
        console.error('Transliteration failed:', error);
        return text;
    }
};

/**
 * Transliterate an array of strings (useful for villages)
 */
export const transliterateArray = async (arr) => {
    const promises = arr.map(item => transliterateToMarathi(item));
    return Promise.all(promises);
};
