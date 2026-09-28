import React, { memo, useCallback, useMemo } from 'react';
import {
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    TextField, Autocomplete,
} from '@mui/material';


const MappingRow = memo(function MappingRow({
    rowKey,
    selectedOption,
    options,
    filterOptions,
    getOptionLabel,
    isOptionEqualToValue,
    selectLabel,
    onChange,
    searchFields,
    uniqueOptions
}) {
    return (
        <TableRow >
            <TableCell>{rowKey}</TableCell>
            <TableCell sx={{mt:1}}>
                <Autocomplete
                    size="small"
                    options={uniqueOptions}
                    filterOptions={filterOptions}
                    value={selectedOption}
                    onChange={(event, newValue) => onChange(rowKey, newValue)}
                    getOptionLabel={getOptionLabel}
                    sx={{width:300}}
                    isOptionEqualToValue={isOptionEqualToValue}
                    renderInput={(params) => (
                        <TextField {...params} label={selectLabel} />
                    )}
                />
            </TableCell>
        </TableRow>
    );
});

const MappingTable = ({
    rows,
    rowKeyField,
    sourceLabel,
    targetLabel,
    selectLabel,
    options,
    optionValueField,
    optionLabel,
    selections,
    onSelectionChange,
    searchFields = [],
}) => {
    const optionsByValue = useMemo(() => {
        const map = new Map();
        options.forEach((option) => map.set(option[optionValueField], option));
        return map;
    }, [options, optionValueField]);

    const getOptionLabel = useCallback(
        (option) => (option ? optionLabel(option) : ''),
        [optionLabel]
    );

    const isOptionEqualToValue = useCallback(
        (option, value) => option[optionValueField] === value[optionValueField],
        [optionValueField]
    );

    const uniqueOptions = useMemo(() => {
        const seen = new Set();
        return options.filter((opt) => {
            const key = opt.code || opt.stk_code;          // dedupe by product code, not prod_id
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [options]);

    const filterOptions = useCallback(
        (opts, { inputValue }) => {
            if (!inputValue) return opts;
            const val = inputValue.toLowerCase().trim().replace(/\s+/g, "");
            
            return opts.filter((opt) => {
                if (searchFields.length === 0) {
                    return getOptionLabel(opt).toLowerCase().replace(/\s+/g, "").startsWith(val);
                }
                return searchFields.some(
                    (field) =>
                        (String(opt[field] || "").toLowerCase()).replace(/\s+/g, "").startsWith(val)
                );
            });
        },
        [searchFields, getOptionLabel]
    );

    const handleOptionChange = useCallback(
        (rowKey, newValue) => {
            onSelectionChange(rowKey, newValue ? newValue[optionValueField] : '');
        },
        [onSelectionChange, optionValueField]
    );

    return (
        <TableContainer>
            <Table size="small">
                <TableHead sx={{backgroundColor: "#F6F5F2",border:'none'}}>
                    <TableRow >
                        <TableCell width="50%" sx={{fontSize: "1.1rem", fontWeight: 500, color: "#000"}}>{sourceLabel}</TableCell>
                        <TableCell sx={{fontSize: "1.1rem", fontWeight: 500, color: "#000"}}>{targetLabel}</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {rows.map((row) => {
                        const key = row[rowKeyField];
                        const selectedOption = optionsByValue.get(selections[key]) || null;
                        return (
                            <MappingRow
                                key={key}
                                rowKey={key}
                                selectedOption={selectedOption}
                                options={options}
                                filterOptions={filterOptions}
                                optionValueField={optionValueField}
                                getOptionLabel={getOptionLabel}
                                isOptionEqualToValue={isOptionEqualToValue}
                                selectLabel={selectLabel}
                                onChange={handleOptionChange}
                                searchFields={searchFields}
                                uniqueOptions={uniqueOptions}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default MappingTable;