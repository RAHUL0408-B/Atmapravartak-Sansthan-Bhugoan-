export const transliterateToMarathi = async (text) => {
    if (!text) return '';

    // Google Input Tools API (Unofficial but widely used for this purpose)
    // itc=mr-t-i0-und (Marathi target)
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=mr-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Response format: ["SUCCESS",[["input","output_array",...]]]
        // We want data[1][0][1][0]
        if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
            return data[1][0][1][0];
        }
        return text; // Fallback to original
    } catch (error) {
        console.error("Transliteration error:", error);
        return text;
    }
};
