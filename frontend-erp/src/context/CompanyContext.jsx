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
            const fetchedCompanies = (res.data || []).map(c => ({
                ...c,
                _id: c._id || c.id,
                id: c.id || c._id
            }));
            setCompanies(fetchedCompanies);

            // 1. Prioritize company with is_active_local: true in DB (Single Source of Truth)
            let selected = fetchedCompanies.find(c => c.is_active_local);

            // 2. Fallback to localStorage if no DB flag is active
            if (!selected) {
                const savedCompanyId = localStorage.getItem('erp_company_id');
                if (savedCompanyId) {
                    selected = fetchedCompanies.find(c => (c._id === savedCompanyId || c.id === savedCompanyId));
                }
            }

            // 3. Fallback to first company
            if (!selected && fetchedCompanies.length > 0) {
                selected = fetchedCompanies[0];
            }

            if (selected) {
                setActiveCompany(selected);
                const compId = selected._id || selected.id;
                if (compId) {
                    localStorage.setItem('erp_company_id', compId);
                }
            }

        } catch (err) {
            console.error('[COMPANY] Error loading companies:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectCompany = async (company, syncDb = false) => {
        if (!company) return;
        const normalized = {
            ...company,
            _id: company._id || company.id,
            id: company.id || company._id
        };
        setActiveCompany(normalized);
        const compId = normalized._id;
        if (compId) {
            localStorage.setItem('erp_company_id', compId);
        }

        // Optimistically update companies state
        setCompanies(prev => prev.map(c => ({
            ...c,
            is_active_local: (c._id || c.id) === compId
        })));

        // Synchronize with database if requested (e.g. from sidebar selector)
        if (syncDb && compId) {
            try {
                await companyService.updateCompany(compId, { is_active_local: true });
                console.log(`[CONTEXT] Database synchronized: ${normalized.name} is now active_local`);
            } catch (err) {
                console.error('[CONTEXT] Error synchronizing active company with DB:', err);
            }
        }
    };

    const switchCompany = async (companyId, type) => {
        try {
            const payload = type === 'local' ? { is_active_local: true } : { is_active_web: true };
            await companyService.updateCompany(companyId, payload);

            if (type === 'local') {
                const found = companies.find(c => (c._id || c.id) === companyId);
                if (found) {
                    await selectCompany(found, false);
                }
            }

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
