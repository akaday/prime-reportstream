import React from "react";
import { Helmet } from "react-helmet-async";

import Table, {
    ColumnConfig,
    LegendItem,
    TableConfig,
} from "../../../components/Table/Table";
import {
    useValueSetsMeta,
    useValueSetsTable,
} from "../../../hooks/UseValueSets";
import {
    LookupTable,
    LookupTables,
    ValueSet,
} from "../../../config/endpoints/lookupTables";
import { withCatchAndSuspense } from "../../../components/RSErrorBoundary";

export const Legend = ({ items }: { items: LegendItem[] }) => {
    const makeItem = (label: string, value: string) => (
        <div key={label} className="display-flex">
            <b>{`${label}:`}</b>
            <span className="padding-left-05">{value}</span>
        </div>
    );
    return (
        <section
            data-testid="table-legend"
            className="display-flex flex-column"
        >
            {items.map((item) => makeItem(item.label, item.value))}
        </section>
    );
};
const valueSetColumnConfig: ColumnConfig[] = [
    {
        dataAttr: "name",
        columnHeader: "Valueset Name",
        feature: {
            link: true,
        },
    },
    {
        dataAttr: "system",
        columnHeader: "System",
    },
    {
        dataAttr: "createdBy",
        columnHeader: "Created By",
    },
    {
        dataAttr: "createdAt",
        columnHeader: "Created At",
    },
];

const toValueSetWithMeta = (
    valueSetMeta: LookupTable,
    valueSetArray: ValueSet[] = [],
) => valueSetArray.map((valueSet) => ({ ...valueSet, ...valueSetMeta }));

const ValueSetsTable = () => {
    const { data: valueSetMeta } = useValueSetsMeta();
    const { data: valueSetArray } = useValueSetsTable<ValueSet[]>(
        LookupTables.VALUE_SET,
    );

    const tableConfig: TableConfig = {
        columns: valueSetColumnConfig,
        rows: toValueSetWithMeta(valueSetMeta, valueSetArray),
    };

    return (
        <>
            <Table title="ReportStream Value Sets" config={tableConfig} />
        </>
    );
};
const ValueSetsIndexPage = () => {
    return (
        <>
            <Helmet>
                <title>Value sets - Admin</title>
            </Helmet>
            <section className="grid-container">
                {withCatchAndSuspense(<ValueSetsTable />)}
            </section>
        </>
    );
};

export default ValueSetsIndexPage;
