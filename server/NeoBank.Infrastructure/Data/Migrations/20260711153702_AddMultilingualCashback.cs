using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMultilingualCashback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "TitleEn", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "TitleRu", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "TitleAz", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "TextEn", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "TextRu", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "TextAz", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");

            // Migrate data
            migrationBuilder.Sql(@"
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Every 5th metro or bus ride', ""TitleRu"" = 'Каждая 5-я поездка в метро или автобусе', ""TitleAz"" = 'Hər 5-ci metro və ya avtobus gedişi', ""TextEn"" = 'Calculated from the average fare across all five rides.', ""TextRu"" = 'Рассчитывается из средней стоимости пяти поездок.', ""TextAz"" = 'Bütün beş gediş üzrə orta gediş haqqından hesablanır.' WHERE ""TitleKey"" = 'catMetroTitle';
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Supermarkets', ""TitleRu"" = 'Супермаркеты', ""TitleAz"" = 'Supermarketlər', ""TextEn"" = 'Everyday grocery spending earns the highest retail rate.', ""TextRu"" = 'Ежедневные траты на продукты приносят максимальный кэшбэк.', ""TextAz"" = 'Gündəlik ərzaq xərcləri ən yüksək pərakəndə satış dərəcəsi qazandırır.' WHERE ""TitleKey"" = 'catSuperTitle';
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Pharmacies', ""TitleRu"" = 'Аптеки', ""TitleAz"" = 'Apteklər', ""TextEn"" = 'Health and pharmacy purchases are included automatically.', ""TextRu"" = 'Покупки для здоровья и аптеки включаются автоматически.', ""TextAz"" = 'Sağlamlıq və aptek alışları avtomatik daxil edilir.' WHERE ""TitleKey"" = 'catPharmTitle';
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Fuel stations', ""TitleRu"" = 'АЗС', ""TitleAz"" = 'Yanacaqdoldurma məntəqələri', ""TextEn"" = 'Cashback for regular car expenses and fuel payments.', ""TextRu"" = 'Кэшбэк на регулярные расходы на автомобиль и топливо.', ""TextAz"" = 'Daimi avtomobil xərcləri və yanacaq ödənişləri üçün kəşbək.' WHERE ""TitleKey"" = 'catFuelTitle';
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Restaurants, cafes, sweets', ""TitleRu"" = 'Рестораны, кафе, сладости', ""TitleAz"" = 'Restoranlar, kafelər, şirniyyatlar', ""TextEn"" = 'Dining, coffee, desserts, and similar food categories.', ""TextRu"" = 'Ужины, кофе, десерты и подобные категории.', ""TextAz"" = 'Yemək, qəhvə, desertlər və oxşar qida kateqoriyaları.' WHERE ""TitleKey"" = 'catRestTitle';
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Clothing and shoes', ""TitleRu"" = 'Одежда и обувь', ""TitleAz"" = 'Geyim və ayaqqabı', ""TextEn"" = 'Fashion, footwear, and wardrobe essentials.', ""TextRu"" = 'Мода, обувь и гардероб.', ""TextAz"" = 'Moda, ayaqqabı və qarderob.' WHERE ""TitleKey"" = 'catClothTitle';
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Trendyol and Temu', ""TitleRu"" = 'Trendyol и Temu', ""TitleAz"" = 'Trendyol və Temu', ""TextEn"" = 'Online marketplace purchases through popular platforms.', ""TextRu"" = 'Покупки на популярных онлайн-площадках.', ""TextAz"" = 'Məşhur platformalar vasitəsilə onlayn bazar alışları.' WHERE ""TitleKey"" = 'catTrendTitle';
                UPDATE ""CashbackCategories"" SET ""TitleEn"" = 'Other payments', ""TitleRu"" = 'Прочие платежи', ""TitleAz"" = 'Digər ödənişlər', ""TextEn"" = 'A base reward for payments outside the main categories.', ""TextRu"" = 'Базовый кэшбэк для платежей вне основных категорий.', ""TextAz"" = 'Əsas kateqoriyalardan kənar ödənişlər üçün baza mükafatı.' WHERE ""TitleKey"" = 'catOtherTitle';
            ");

            migrationBuilder.DropColumn(name: "TitleKey", table: "CashbackCategories");
            migrationBuilder.DropColumn(name: "TextKey", table: "CashbackCategories");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "TitleKey", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "TextKey", table: "CashbackCategories", type: "text", nullable: false, defaultValue: "");

            migrationBuilder.DropColumn(name: "TextAz", table: "CashbackCategories");
            migrationBuilder.DropColumn(name: "TextEn", table: "CashbackCategories");
            migrationBuilder.DropColumn(name: "TextRu", table: "CashbackCategories");
            migrationBuilder.DropColumn(name: "TitleAz", table: "CashbackCategories");
            migrationBuilder.DropColumn(name: "TitleEn", table: "CashbackCategories");
            migrationBuilder.DropColumn(name: "TitleRu", table: "CashbackCategories");
        }
    }
}
