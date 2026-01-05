import React, { createContext, useState, useEffect, useContext } from 'react';
import { companyService } from '../services/api';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const [companies, setCompanies] = useState([]);
    const [activeLocalCompany, setActiveLocalCompany] = useState(null);
    const [activeWebCompany, setActiveWebCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize: Load companies and set active
    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const res = await companyService.getCompanies();
            const fetchedCompanies = res.data;
            setCompanies(fetchedCompanies);

            // Determine active local and web companies from backend flags
            const local = fetchedCompanies.find(c => c.is_active_local);
            const web = fetchedCompanies.find(c => c.is_active_web);

            setActiveLocalCompany(local || fetchedCompanies[0] || null);
            setActiveWebCompany(web || fetchedCompanies[0] || null);

        } catch (err) {
            console.error("CompanyContext: Error loading companies", err);
        } finally {
            setLoading(false);
        }
    };

    const switchCompany = async (companyId, type = 'local') => {
        try {
            const data = type === 'local' ? { is_active_local: true } : { is_active_web: true };
            await companyService.updateCompany(companyId, data);
            await loadCompanies();
        } catch (err) {
            console.error(`Error switching ${type} company:`, err);
        }
    };

    const refreshCompanies = async () => {
        await loadCompanies();
    };

    return (
        <CompanyContext.Provider value={{
            companies,
            activeCompany: activeLocalCompany, // Backward compatibility
            activeLocalCompany,
            activeWebCompany,
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
