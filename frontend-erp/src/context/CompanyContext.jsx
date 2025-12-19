import React, { createContext, useState, useEffect, useContext } from 'react';
import { companyService } from '../services/api';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const [companies, setCompanies] = useState([]);
    const [activeCompany, setActiveCompany] = useState(null);
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

            // Logic to determine active company
            const savedCompanyId = localStorage.getItem('activeCompanyId');

            if (savedCompanyId) {
                const found = fetchedCompanies.find(c => c._id === savedCompanyId);
                if (found) {
                    setActiveCompany(found);
                } else if (fetchedCompanies.length > 0) {
                    // Fallback if saved ID not found
                    setActiveCompany(fetchedCompanies[0]);
                    localStorage.setItem('activeCompanyId', fetchedCompanies[0]._id);
                }
            } else if (fetchedCompanies.length > 0) {
                // Default to first
                setActiveCompany(fetchedCompanies[0]);
                localStorage.setItem('activeCompanyId', fetchedCompanies[0]._id);
            }
        } catch (err) {
            console.error("CompanyContext: Error loading companies", err);
        } finally {
            setLoading(false);
        }
    };

    const switchCompany = (companyId) => {
        const company = companies.find(c => c._id === companyId);
        if (company) {
            setActiveCompany(company);
            localStorage.setItem('activeCompanyId', company._id);
        }
    };

    const refreshCompanies = async () => {
        await loadCompanies();
    };

    return (
        <CompanyContext.Provider value={{
            companies,
            activeCompany,
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
