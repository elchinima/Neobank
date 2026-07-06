using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCashbackTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VatReceipts");

            migrationBuilder.CreateTable(
                name: "CashbackCategories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TitleKey = table.Column<string>(type: "text", nullable: false),
                    TextKey = table.Column<string>(type: "text", nullable: false),
                    Rate = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashbackCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CashbackMccs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashbackMccs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CashbackMccs_CashbackCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "CashbackCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserCashbacks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<string>(type: "text", nullable: false),
                    AmountEarned = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCashbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCashbacks_CashbackCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "CashbackCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCashbacks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CashbackMccs_CategoryId",
                table: "CashbackMccs",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCashbacks_CategoryId",
                table: "UserCashbacks",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCashbacks_UserId",
                table: "UserCashbacks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCashbacks_UserId_CategoryId",
                table: "UserCashbacks",
                columns: new[] { "UserId", "CategoryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CashbackMccs");

            migrationBuilder.DropTable(
                name: "UserCashbacks");

            migrationBuilder.DropTable(
                name: "CashbackCategories");

            migrationBuilder.CreateTable(
                name: "VatReceipts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ShopName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    VatRefund = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VatReceipts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VatReceipts_UserId",
                table: "VatReceipts",
                column: "UserId");
        }
    }
}
