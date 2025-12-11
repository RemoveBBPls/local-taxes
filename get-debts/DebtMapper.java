import java.util.*;
import java.util.stream.Collectors;

public class DebtMapper {

    public static MappedDebts map(
            String idn,
            String name,
            String currency,
            List<RawDebt> debts
    ) {

        // --- 1: Group by (partida + dsCode + dsName + description)
        Map<String, List<RawDebt>> grouped = debts.stream().collect(
                Collectors.groupingBy(d ->
                        d.partida() + "|" + d.dsCode() + "|" + d.dsName() + "|" + d.description()
                )
        );

        List<Group> groups = new ArrayList<>();

        for (List<RawDebt> groupDebts : grouped.values()) {

            RawDebt meta = groupDebts.get(0);
            String partida = meta.partida();
            String dsName = meta.dsName();
            String description = meta.description();
            int dsCode = meta.dsCode();

            // --- 2: Build categories grouped by debtKindId
            Map<Integer, List<RawDebt>> categoryGroups = groupDebts.stream()
                    .collect(Collectors.groupingBy(RawDebt::debtKindId));

            List<Category> categories = categoryGroups.entrySet().stream()
                    .map(e -> {
                        int kindId = e.getKey();
                        List<RawDebt> list = e.getValue();

                        double sum = list.stream()
                                .mapToDouble(d -> d.residual() + d.interest())
                                .sum();

                        return new Category(
                                kindId,
                                list.get(0).debtKindName(),
                                new Money(sum, currency)
                        );
                    })
                    .toList();

            // --- 3: Group by budgetYear and sort by payOrder
            Map<Integer, List<RawDebt>> byYear = groupDebts.stream()
                    .collect(Collectors.groupingBy(RawDebt::budgetYear));

            List<DebtsByYear> debtsByYear = byYear.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .map(e -> {
                        int year = e.getKey();

                        List<DebtByPayOrder> payOrderList = e.getValue().stream()
                                .sorted(Comparator.comparingInt(RawDebt::payOrder))
                                .map(d -> new DebtByPayOrder(
                                        d,
                                        new AmountDue(
                                                d.residual() + d.interest(),
                                                d.residual(),
                                                d.interest(),
                                                currency
                                        )
                                ))
                                .toList();

                        return new DebtsByYear(year, payOrderList);
                    })
                    .toList();

            groups.add(new Group(
                    partida,
                    dsName,
                    description,
                    dsCode,
                    categories,
                    debtsByYear
            ));
        }

        return new MappedDebts(idn, name, currency, groups);
    }
}
