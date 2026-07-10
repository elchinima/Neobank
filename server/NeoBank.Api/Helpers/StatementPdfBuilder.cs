using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using NeoBank.Core.Entities;
using System.Linq;

namespace NeoBank.Api.Helpers;

public static class StatementPdfBuilder
{
    static StatementPdfBuilder()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] Generate(
        ApplicationUser user, 
        Card? card, 
        List<Transaction> transactions, 
        string language, 
        DateTime fromDate, 
        DateTime toDate,
        decimal startBalance,
        decimal endBalance,
        string bankAddress,
        string bankPhone,
        decimal creditLimit,
        decimal debt)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily(Fonts.Arial));

                page.Header().Element(x => ComposeHeader(x, language, bankAddress, bankPhone));
                page.Content().Element(x => ComposeContent(x, user, card, transactions, language, fromDate, toDate, startBalance, endBalance, creditLimit, debt));
            });
        });

        return doc.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, string lang, string bankAddress, string bankPhone)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("NeoBank").FontSize(20).SemiBold();
                
                var desc = lang switch {
                    "az" => "NeoBank Kommersiya Bankı Açıq Səhmdar Cəmiyyəti",
                    "ru" => "Открытое Акционерное Общество Коммерческий Банк NeoBank",
                    _ => "NeoBank Commercial Bank Open Joint Stock Company"
                };
                column.Item().Text(desc).FontSize(9);
                column.Item().Text("31415926535"); // Static random registration number
                column.Item().Text(bankAddress);
                column.Item().Text(bankPhone);
                column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Medium);
            });
        });
    }

    private static void ComposeContent(IContainer container, ApplicationUser user, Card? card, List<Transaction> transactions, string lang, DateTime fromDate, DateTime toDate, decimal startBalance, decimal endBalance, decimal creditLimit, decimal debt)
    {
        container.PaddingVertical(0.5f, Unit.Centimetre).Column(column =>
        {
            column.Spacing(15);
            column.Item().Element(x => ComposeDetails(x, user, card, lang, fromDate, toDate, startBalance, endBalance, transactions, creditLimit, debt));
            column.Item().Element(x => ComposeTable(x, transactions, lang, startBalance));
        });
    }

    private static void ComposeDetails(IContainer container, ApplicationUser user, Card? card, string lang, DateTime fromDate, DateTime toDate, decimal startBalance, decimal endBalance, List<Transaction> transactions, decimal creditLimit, decimal debt)
    {
        var lblPeriod = lang == "az" ? "Dövr" : (lang == "ru" ? "Период" : "Period");
        var lblAccount = lang == "az" ? "Hesabın nömrəsi" : (lang == "ru" ? "Номер счета" : "Account number");
        var lblCard = lang == "az" ? "Kartın nömrəsi" : (lang == "ru" ? "Номер карты" : "Card number");
        var lblCustomer = lang == "az" ? "Müştərinin adı" : (lang == "ru" ? "Имя клиента" : "Customer name");
        var lblAddress = lang == "az" ? "Müştərinin ünvanı" : (lang == "ru" ? "Адрес клиента" : "Customer address");
        
        var lblCurrency = lang == "az" ? "Valyutanın adı" : (lang == "ru" ? "Валюта" : "Currency");
        var lblStartBal = lang == "az" ? "Dövrün əvvəlində qalıq" : (lang == "ru" ? "Остаток на начало периода" : "Balance at the beginning of the period");
        var lblEndBal = lang == "az" ? "Dövrün sonunda qalıq" : (lang == "ru" ? "Остаток на конец периода" : "Balance at the end of the period");
        var lblTotalInc = lang == "az" ? "Dövr üzrə mədaxil əməliyyatlarının cəmi" : (lang == "ru" ? "Сумма приходных операций за период" : "Total income transactions for the period");
        var lblTotalExp = lang == "az" ? "Dövr üzrə məxaric əməliyyatlarının cəmi" : (lang == "ru" ? "Сумма расходных операций за период" : "Total expenditure transactions for the period");

        var lblCreditLimit = lang == "az" ? "Kredit limiti" : (lang == "ru" ? "Кредитный лимит" : "Credit limit");
        var lblDebt = lang == "az" ? "Borc" : (lang == "ru" ? "Долг" : "Debt");

        var accountNo = card != null ? card.Iban : "All Accounts";
        var cardNo = card != null ? MaskCardNumber(card.CardNumber) : "All Cards";
        var custName = user.FirstName + " " + user.LastName;
        
        var totalInc = transactions.Where(t => t.Type == "Income").Sum(t => t.Amount);
        var totalExp = transactions.Where(t => t.Type != "Income").Sum(t => t.Amount);

        container.Column(col =>
        {
            col.Item().Text($"{lblPeriod} (Period): {fromDate:dd-MM-yyyy} - {toDate:dd-MM-yyyy}");
            col.Item().Text($"{lblAccount} (Account number): {accountNo}");
            col.Item().Text($"{lblCard} (Card number): {cardNo}");
            col.Item().Text($"{lblCustomer} (Customer name): {custName.ToUpper()}");
            col.Item().Text($"{lblAddress} (Customer address): BAKI ŞƏHƏRİ");
            
            col.Item().PaddingTop(10).Text($"{lblCurrency} (Currency): AZN");
            col.Item().Text($"{lblStartBal} (Balance at the beginning of the period): {startBalance:F2}");
            col.Item().Text($"{lblEndBal} (Balance at the end of the period): {endBalance:F2}");
            col.Item().Text($"{lblTotalInc} (Total income transactions for the period): {totalInc:F2}");
            col.Item().Text($"{lblTotalExp} (Total expenditure transactions for the period): {totalExp:F2}");
            
            col.Item().PaddingTop(10).Text($"{lblCreditLimit} (Credit limit): {creditLimit:F2}");
            col.Item().Text($"{lblDebt} (Debt): {debt:F2}");
        });
    }

    private static string MaskCardNumber(string cardNo)
    {
        if (string.IsNullOrEmpty(cardNo) || cardNo.Length < 8) return cardNo;
        return cardNo.Substring(0, 4) + "****" + cardNo.Substring(cardNo.Length - 4);
    }

    private static void ComposeTable(IContainer container, List<Transaction> transactions, string lang, decimal startBalance)
    {
        var colDate = lang == "az" ? "Tarix" : (lang == "ru" ? "Дата" : "Date");
        var colDest = lang == "az" ? "Təyinat" : (lang == "ru" ? "Назначение" : "Destination");
        var colAmt = lang == "az" ? "Məbləğ" : (lang == "ru" ? "Сумма" : "Amount");
        var colComm = lang == "az" ? "Komissiya" : (lang == "ru" ? "Комиссия" : "Commission");
        var colVat = lang == "az" ? "ƏDV" : (lang == "ru" ? "НДС" : "VAT");
        var colBal = lang == "az" ? "Balans" : (lang == "ru" ? "Баланс" : "Balance");

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(70);
                columns.RelativeColumn();
                columns.ConstantColumn(60);
                columns.ConstantColumn(60);
                columns.ConstantColumn(50);
                columns.ConstantColumn(60);
            });

            table.Header(header =>
            {
                header.Cell().Element(CellStyle).AlignCenter().Text(colDate).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colDest).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colAmt).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colComm).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colVat).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colBal).Bold();

                static IContainer CellStyle(IContainer container)
                {
                    return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).Border(1).BorderColor(Colors.Black);
                }
            });

            var chronTransactions = transactions.OrderBy(t => t.CreatedAt).ToList();
            var runningBalance = startBalance;

            foreach (var t in chronTransactions)
            {
                var isIncome = t.Type == "Income";
                var amtPrefix = isIncome ? "+" : "-";
                
                if (isIncome) runningBalance += t.Amount;
                else runningBalance -= t.Amount;

                table.Cell().Element(CellStyle).AlignCenter().Text($"{t.CreatedAt:dd-MM-yyyy\nHH:mm:ss}");
                table.Cell().Element(CellStyle).AlignCenter().Text(t.Description);
                table.Cell().Element(CellStyle).AlignCenter().Text($"{amtPrefix}{t.Amount:F2}");
                table.Cell().Element(CellStyle).AlignCenter().Text("-");
                table.Cell().Element(CellStyle).AlignCenter().Text("-");
                table.Cell().Element(CellStyle).AlignCenter().Text($"{runningBalance:F2}");
                
                static IContainer CellStyle(IContainer container)
                {
                    return container.Border(1).BorderColor(Colors.Black).PaddingVertical(5).PaddingHorizontal(2).AlignMiddle();
                }
            }
        });
    }
}
