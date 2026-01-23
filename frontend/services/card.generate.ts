import axios from '@/lib/axios';
import { createCardService, ProgramType } from '@/lib/services/card.base.service';

export interface CardProduct {
    id: string;
    serialTemplate: string;
    category: {
        categoryName: string;
    };
    type: {
        typeName: string;
    };
}

export interface GenerateHistoryItem {
    id: string;
    movementAt: string;
    quantity: number;
    category: {
        name: string;
    };
    type: {
        name: string;
    };
    serialNumbers: string[];
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface HistoryResponse {
    items: GenerateHistoryItem[];
    pagination: Pagination;
}

const CardGenerateService = {
    getProducts: async (programType?: string) => {
        if (!programType) {
            const res = await axios.get('/card/product');
            return res.data?.data || [];
        }

        const baseService = createCardService(programType.toUpperCase() as ProgramType);
        return baseService.getProducts();
    },

    getHistory: async (params: { page: number; limit: number; programType?: string }) => {
        const res = await axios.get('/cards/generate/history', { params });
        return res.data?.data;
    },

    getNextSerial: async (cardProductId: string) => {
        const res = await axios.get('/cards/generate/next-serial', {
            params: { cardProductId },
        });
        return res.data?.data?.nextSerial || res.data?.data?.serial || res.data?.data || '';
    },

    getHistoryDetail: async (id: string) => {
        const res = await axios.get(`/cards/generate/history/${id}`);
        return res.data?.data;
    },

    generate: async (payload: {
        cardProductId: string;
        startSerial: string;
        endSerial: string;
        programType?: string;
    }) => {
        const res = await axios.post('/cards/generate', payload);
        return res.data;
    },
};

export default CardGenerateService;
