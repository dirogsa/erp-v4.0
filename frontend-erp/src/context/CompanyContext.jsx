import React, { createContext, useState, useEffect, useContext } from 'react';
import { companyService } from '../services/api';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const [companies, setCompanies] = useState([]);
    const [activeCompany, setActiveCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const res = await companyService.getCompanies();
            const fetchedCompanies = res.data;
            setCompanies(fetchedCompanies);

            // 1. Check LocalStorage for previously selected company
            const savedCompanyId = localStorage.getItem('erp_company_id');
            let selected = null;

            if (savedCompanyId) {
                selected = fetchedCompanies.find(c => c._id === savedCompanyId);
            }

            // 2. Fallback to active_local or first one
            if (!selected) {
                selected = fetchedCompanies.find(c => c.is_active_local) || fetchedCompanies[0];
            }

            if (selected) {
                selectCompany(selected);
            }

        } catch (err) {
            console.error('[COMPANY] Error loading companies:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectCompany = (company) => {
        setActiveCompany(company);
        localStorage.setItem('erp_company_id', company._id);
        console.log(`[CONTEXT] Context switched to: ${company.name}`);
    };

    const switchCompany = async (companyId, type) => {
        try {
            const payload = type === 'local' ? { is_active_local: true } : { is_active_web: true };
            await companyService.updateCompany(companyId, payload);
            await refreshCompanies();
        } catch (err) {
            console.error('[CONTEXT] Error switching company:', err);
        }
    };

    const refreshCompanies = async () => {
        await loadCompanies();
    };

    return (
        <CompanyContext.Provider value={{
            companies,
            activeCompany,
            selectCompany,
            switchCompany,
            loading,
            refreshCompanies
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error("useCompany must be used within a CompanyProvider");
    }
    return context;
};
