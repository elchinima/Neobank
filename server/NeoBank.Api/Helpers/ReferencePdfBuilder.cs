using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using NeoBank.Core.Entities;
using System.Linq;

namespace NeoBank.Api.Helpers;

public static class ReferencePdfBuilder
{
    static ReferencePdfBuilder()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] Generate(
        ApplicationUser user,
        string referenceType,
        string lang,
        string bankAddress,
        string bankPhone,
        List<Card>? creditLines,
        List<Loan>? loans,
        List<Deposit>? deposits)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                page.Header().Element(x => ComposeHeader(x, lang, bankAddress, bankPhone));
                page.Content().Element(x => ComposeContent(x, user, referenceType, lang, creditLines, loans, deposits));
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
                column.Item().Text("31415926535");
                column.Item().Text(bankAddress);
                column.Item().Text(bankPhone);
                column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Medium);
            });
        });
    }

    private static void ComposeContent(IContainer container, ApplicationUser user, string referenceType, string lang, List<Card>? creditLines, List<Loan>? loans, List<Deposit>? deposits)
    {
        var docTitle = referenceType switch {
            "CreditLine" => lang == "az" ? "Kredit xətti haqqında arayış" : (lang == "ru" ? "Справка о кредитной линии" : "Certificate of credit line"),
            "Debt" => lang == "az" ? "Bank qarşısında borc haqqında arayış" : (lang == "ru" ? "Справка о задолженности в Банк" : "Certificate of debt to the Bank"),
            "Deposits" => lang == "az" ? "Mövcud depozitlər haqqında arayış" : (lang == "ru" ? "Справка об имеющихся депозитах" : "Certificate of existing deposits"),
            _ => "Reference"
        };

        var lblCustomer = lang == "az" ? "Müştərinin adı" : (lang == "ru" ? "Имя клиента" : "Customer name");
        var lblDate = lang == "az" ? "Tarix" : (lang == "ru" ? "Дата" : "Date");
        var custName = user.FirstName + " " + user.LastName;

        container.PaddingVertical(1, Unit.Centimetre).Column(column =>
        {
            column.Spacing(20);
            
            column.Item().AlignCenter().Text(docTitle).FontSize(16).SemiBold();

            column.Item().Column(infoCol => {
                infoCol.Spacing(5);
                infoCol.Item().Text($"{lblCustomer}: {custName.ToUpper()}");
                infoCol.Item().Text($"{lblDate}: {DateTime.UtcNow:dd-MM-yyyy HH:mm}");
            });

            if (referenceType == "CreditLine" && creditLines != null)
            {
                column.Item().Element(x => ComposeCreditLineTable(x, creditLines, lang));
            }
            else if (referenceType == "Debt" && loans != null)
            {
                column.Item().Element(x => ComposeDebtTable(x, loans, lang));
            }
            else if (referenceType == "Deposits" && deposits != null)
            {
                column.Item().Element(x => ComposeDepositsTable(x, deposits, lang));
            }
        });
    }

    private static void ComposeCreditLineTable(IContainer container, List<Card> cards, string lang)
    {
        var colNumber = lang == "az" ? "Kartın nömrəsi" : (lang == "ru" ? "Номер карты" : "Card Number");
        var colType = lang == "az" ? "Kartın tipi" : (lang == "ru" ? "Тип карты" : "Card Type");
        var colLimit = lang == "az" ? "Kredit limiti (AZN)" : (lang == "ru" ? "Кредитный лимит (AZN)" : "Credit Limit (AZN)");
        var colStatus = lang == "az" ? "Status" : (lang == "ru" ? "Статус" : "Status");

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(2);
                columns.RelativeColumn(1);
                columns.RelativeColumn(2);
                columns.RelativeColumn(1);
            });

            table.Header(header =>
            {
                header.Cell().Element(CellStyle).AlignCenter().Text(colNumber).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colType).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colLimit).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colStatus).Bold();

                static IContainer CellStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).Border(1).BorderColor(Colors.Black);
            });

            foreach (var c in cards)
            {
                table.Cell().Element(CellStyle).AlignCenter().Text(MaskCardNumber(c.CardNumber));
                table.Cell().Element(CellStyle).AlignCenter().Text(c.CardType);
                table.Cell().Element(CellStyle).AlignCenter().Text($"{c.CreditLimit:F2}");
                table.Cell().Element(CellStyle).AlignCenter().Text(c.Status);
                
                static IContainer CellStyle(IContainer container) => container.Border(1).BorderColor(Colors.Black).PaddingVertical(5).PaddingHorizontal(2).AlignMiddle();
            }
        });
    }

    private static void ComposeDebtTable(IContainer container, List<Loan> loans, string lang)
    {
        var colId = lang == "az" ? "Kredit İD" : (lang == "ru" ? "ID кредита" : "Loan ID");
        var colAmount = lang == "az" ? "Məbləğ (AZN)" : (lang == "ru" ? "Сумма (AZN)" : "Amount (AZN)");
        var colBalance = lang == "az" ? "Qalıq (AZN)" : (lang == "ru" ? "Остаток (AZN)" : "Remaining Balance (AZN)");
        var colStatus = lang == "az" ? "Status" : (lang == "ru" ? "Статус" : "Status");

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(2);
                columns.RelativeColumn(2);
                columns.RelativeColumn(2);
                columns.RelativeColumn(1);
            });

            table.Header(header =>
            {
                header.Cell().Element(CellStyle).AlignCenter().Text(colId).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colAmount).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colBalance).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colStatus).Bold();

                static IContainer CellStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).Border(1).BorderColor(Colors.Black);
            });

            var sortedLoans = loans.OrderBy(l => l.Status == "Active" ? 0 : 1).ThenByDescending(l => l.Amount).ToList();

            foreach (var l in sortedLoans)
            {
                table.Cell().Element(CellStyle).AlignCenter().Text(l.Id.Substring(0, 8));
                table.Cell().Element(CellStyle).AlignCenter().Text($"{l.Amount:F2}");
                table.Cell().Element(CellStyle).AlignCenter().Text($"{l.RemainingBalance:F2}");
                table.Cell().Element(CellStyle).AlignCenter().Text(l.Status);
                
                static IContainer CellStyle(IContainer container) => container.Border(1).BorderColor(Colors.Black).PaddingVertical(5).PaddingHorizontal(2).AlignMiddle();
            }
        });
    }

    private static void ComposeDepositsTable(IContainer container, List<Deposit> deposits, string lang)
    {
        var colId = lang == "az" ? "Depozit İD" : (lang == "ru" ? "ID депозита" : "Deposit ID");
        var colAmount = lang == "az" ? "Məbləğ (AZN)" : (lang == "ru" ? "Сумма (AZN)" : "Amount (AZN)");
        var colRate = lang == "az" ? "Faiz dərəcəsi" : (lang == "ru" ? "Процент" : "Rate (%)");
        var colStatus = lang == "az" ? "Status" : (lang == "ru" ? "Статус" : "Status");

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(2);
                columns.RelativeColumn(2);
                columns.RelativeColumn(2);
                columns.RelativeColumn(1);
            });

            table.Header(header =>
            {
                header.Cell().Element(CellStyle).AlignCenter().Text(colId).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colAmount).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colRate).Bold();
                header.Cell().Element(CellStyle).AlignCenter().Text(colStatus).Bold();

                static IContainer CellStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).Border(1).BorderColor(Colors.Black);
            });

            foreach (var d in deposits)
            {
                table.Cell().Element(CellStyle).AlignCenter().Text(d.Id.Substring(0, 8));
                table.Cell().Element(CellStyle).AlignCenter().Text($"{d.Amount:F2}");
                table.Cell().Element(CellStyle).AlignCenter().Text($"{d.InterestRate:F2}%");
                table.Cell().Element(CellStyle).AlignCenter().Text(d.Status);
                
                static IContainer CellStyle(IContainer container) => container.Border(1).BorderColor(Colors.Black).PaddingVertical(5).PaddingHorizontal(2).AlignMiddle();
            }
        });
    }

    private static string MaskCardNumber(string cardNo)
    {
        if (string.IsNullOrEmpty(cardNo) || cardNo.Length < 8) return cardNo;
        return cardNo.Substring(0, 4) + "****" + cardNo.Substring(cardNo.Length - 4);
    }
}
