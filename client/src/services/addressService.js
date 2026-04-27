import axios from 'axios';

const BASE_URL = 'https://api.postalpincode.in';

export const getPostOfficeDetails = async (villageName) => {
    try {
        const response = await axios.get(`${BASE_URL}/postoffice/${villageName}`);
        if (response.data && response.data[0].Status === 'Success') {
            return response.data[0].PostOffice;
        }
        return [];
    } catch (error) {
        console.error("Error fetching pincode details:", error);
        return [];
    }
};

export const getDetailsByPincode = async (pincode) => {
    try {
        const response = await axios.get(`${BASE_URL}/pincode/${pincode}`);
        if (response.data && response.data[0].Status === 'Success') {
            return response.data[0].PostOffice;
        }
        return [];
    } catch (error) {
        console.error("Error fetching details by pincode:", error);
        return [];
    }
};
